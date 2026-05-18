import java.io.*;
import java.net.InetSocketAddress;
import java.net.Socket;

public class UploadTCPClient {
    public static void main(String[] args) throws IOException {

        File fileToUpload = new File("bird.jpg");

        Socket socket = new Socket();
        socket.connect(new InetSocketAddress("127.0.0.1",10001));
        System.out.println("连接到服务器端，开始文件上传！\n");
        // 还是老样子，创建数据输入输出流
        DataOutputStream dos = new DataOutputStream(socket.getOutputStream());
        DataInputStream dis = new DataInputStream(socket.getInputStream());

        // 先告诉服务端数据长度
        dos.writeInt((int)fileToUpload.length());
        byte[] data = new byte[(int)fileToUpload.length()];
        // 读取文件数据
        FileInputStream fis = new FileInputStream(fileToUpload);
        try{
            fis.read(data);
        }finally {
            fis.close();
        }
        // 写入文件数据
        dos.write(data);
        // 走你！
        dos.flush();

        // 读取来自服务端的消息
        System.out.println(dis.readUTF());

        // 完成，关闭socket。
        socket.close();

    }
}

