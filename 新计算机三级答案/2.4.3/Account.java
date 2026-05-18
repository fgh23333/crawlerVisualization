import java.util.Random;

class Father implements Runnable {
    private Account account;

    Father(Account account) {
        this.account = account;
    }

    @Override
    public void run() {
        Random rnd = new Random();
        while (true) {
                int amount = rnd.nextInt(1, 5) * 100;
                account.store(amount);
                System.out.println("父亲存入：" + amount);



        }
    }
}

class Son implements Runnable {

    private Account account;

    Son(Account account) {
        this.account = account;
    }

    @Override
    public void run() {
        while (true) {
            try {
                    int amount = account.get();
                    System.out.println("儿子取出：" + amount);


            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        }
    }
}


public class Account {

    private int balance = 0;

    public synchronized void store(int amount) {
        balance += amount;
        notify(); // 通知儿子来取钱
        try {
            wait(); // 等待账户为空
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    public synchronized int get() throws InterruptedException {
        int amount = balance;
        balance = 0;
        notify(); // 通知账户为空
        wait(); // 等待父亲来存钱
        return amount;
    }


    public static void main(String[] args) throws InterruptedException {
        Account account = new Account();
        Son son = new Son(account);
        Father father = new Father(account);
        Thread tSon = new Thread(son);
        Thread tFather = new Thread(father);
        tSon.start();
        tFather.start();
        tSon.join();
        tFather.join();
    }
}

