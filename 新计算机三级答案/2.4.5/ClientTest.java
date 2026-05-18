import java.io.*;
import java.net.InetSocketAddress;
import java.net.Socket;

public class ClientTest {
    public static void main(String[] args) throws IOException {

        File fileToUpload = new File("D:\\test.txt");

        Socket socket = new Socket();
        socket.connect(new InetSocketAddress("127.0.0.1",5678));
        System.out.println("服务器连接成功");
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
        // 完成，关闭socket。
        socket.close();

    }
}
